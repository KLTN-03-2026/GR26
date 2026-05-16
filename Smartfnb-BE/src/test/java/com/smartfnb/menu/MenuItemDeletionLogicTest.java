package com.smartfnb.menu;

import com.smartfnb.menu.application.command.MenuItemCommandHandler;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaEntity;
import com.smartfnb.menu.infrastructure.persistence.MenuItemJpaRepository;
import com.smartfnb.menu.infrastructure.persistence.RecipeJpaRepository;
import com.smartfnb.menu.infrastructure.persistence.AddonJpaRepository;
import com.smartfnb.shared.TenantContext;
import com.smartfnb.shared.exception.SmartFnbException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class MenuItemDeletionLogicTest {

    @Mock private MenuItemJpaRepository menuItemJpaRepository;
    @Mock private RecipeJpaRepository recipeJpaRepository;
    @Mock private AddonJpaRepository addonJpaRepository;

    @InjectMocks
    private MenuItemCommandHandler handler;

    private UUID tenantId = UUID.randomUUID();
    private UUID itemId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        TenantContext.setCurrentTenantId(tenantId);
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Test chặn xoá nguyên liệu khi đang được dùng trong công thức")
    void testDeleteIngredient_BlockedByRecipe() {
        // Arrange
        MenuItemJpaEntity entity = mock(MenuItemJpaEntity.class);
        when(entity.getType()).thenReturn("INGREDIENT");
        
        when(menuItemJpaRepository.findByIdAndTenantIdAndDeletedAtIsNull(any(), any()))
                .thenReturn(Optional.of(entity));
        when(recipeJpaRepository.existsByIngredientItemId(itemId)).thenReturn(true);

        // Act & Assert
        SmartFnbException ex = assertThrows(SmartFnbException.class, () -> {
            handler.deleteMenuItem(itemId);
        });
        assertEquals("ITEM_IN_USE", ex.getErrorCode());
        verify(menuItemJpaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test chặn xoá món ăn khi đang là target của công thức")
    void testDeleteMenuItem_BlockedByTargetRecipe() {
        // Arrange
        MenuItemJpaEntity entity = mock(MenuItemJpaEntity.class);
        when(entity.getType()).thenReturn("FOOD");
        
        when(menuItemJpaRepository.findByIdAndTenantIdAndDeletedAtIsNull(any(), any()))
                .thenReturn(Optional.of(entity));
        when(recipeJpaRepository.existsByTargetItemId(itemId)).thenReturn(true);

        // Act & Assert
        SmartFnbException ex = assertThrows(SmartFnbException.class, () -> {
            handler.deleteMenuItem(itemId);
        });
        assertEquals("ITEM_IN_USE", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("đang có công thức chế biến"));
    }
}

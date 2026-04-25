package com.smartfnb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfnb.shared.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext
public class ShiftTemplateApiScratchTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        UUID tenantId = UUID.randomUUID();
        UUID branchId = UUID.randomUUID();
        UUID staffId = UUID.randomUUID();
        TenantContext.setCurrentTenantId(tenantId);
        TenantContext.setCurrentBranchId(branchId);
        TenantContext.setCurrentUserId(staffId);
    }

    @Test
    @WithMockUser(roles = "OWNER")
    public void testPost() throws Exception {
        String json = """
            {
                "name": "Ca sáng test",
                "startTime": "08:00:00",
                "endTime": "12:00:00",
                "minStaff": 2,
                "maxStaff": 5,
                "color": "#FF5733",
                "active": true
            }
        """;

        mockMvc.perform(post("/api/v1/shift-templates")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isCreated());
    }
}
